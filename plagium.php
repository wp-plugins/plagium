<?php
/*
Plugin Name: Plagium
Plugin URI: http://www.plagium.com/wordpress.cfm
Description: Plagium is an innovative, fast, and easy-to-use means to check text against possible plagiarism or possible sources of origination.
Author: plagium.com
Version: 1.0.2
Author URI: http://www.plagium.om
License: GPLv3
*/

if (is_admin()) $plagium = new Plagium();

class Plagium {
    const PLUGIN_VERSION = '1.0.2';
    const LANGUAGE = 'en';

    public function __construct(){
	    add_action('admin_enqueue_scripts',array(&$this,'add_header_styles'));
	    add_action('admin_enqueue_scripts',array(&$this,'add_header_scripts'));
    
	    add_action('admin_menu',array(&$this,'admin_actions'));
	    add_action('add_meta_boxes', array(&$this,'add_meta_boxes'));
	    add_action('wp_dashboard_setup', array(&$this,'add_dashboard_meta_boxes') );
    }

    public function add_header_styles($hook){
	    if (in_array($hook, array('post.php','post-new.php','settings_page_plagium-admin'))){
	      wp_enqueue_style('plagium_css', plugins_url('assets/plagium.css',__FILE__),false,false,'all');
	      wp_enqueue_style('thickbox');
	    }
    }

    public function add_header_scripts($hook){
	    if (in_array($hook, array('post.php','post-new.php','settings_page_plagium-admin'))){
	      wp_enqueue_script( 'jquery');
	      wp_enqueue_script( 'thickbox');
          wp_enqueue_script( 'plagium_language', plugin_dir_url( __FILE__ ) . 'assets/languages/en.js' );
          wp_enqueue_script( 'plagium_ajax_api', plugin_dir_url( __FILE__ ) . 'assets/plagium_ajax_api.js' );
	    }
    }

    public function update_user_option($name,$value){
	    $uid = get_current_user_id();
	    if($uid == 0) return false;
	    return update_user_meta($uid, $name, $value);
    }

    public function get_user_option($name){
	    $uid = get_current_user_id();
	    if($uid == 0) return false;
	    return get_user_meta($uid, $name, true);
    }

    public function update_admin_option($name,$value){
	    $uid = get_current_user_id();
	    if($uid == 0) return false;
	    return update_option($name, $value);
    }

    public function get_admin_option($name){
	    $uid = get_current_user_id();
	    if($uid == 0) return false;
	    return get_option($name, true);
    }

    public function admin_actions(){
        if (!$this->get_admin_option('plagium_api_key')) $this->update_admin_option('plagium_api_key', "");
        if (!$this->get_admin_option('plagium_email')) $this->update_admin_option('plagium_email', "");
        if (!$this->get_admin_option('plagium_password')) $this->update_admin_option('plagium_password', "");
        if (!$this->get_admin_option('plagium_deep_search')) $this->update_admin_option('plagium_deep_search', "yes");
        if (!$this->get_admin_option('plagium_exclude_domains')) $this->update_admin_option('plagium_exclude_domains', parse_url(home_url(), PHP_URL_HOST));
	    add_options_page(__("Plagium", self::LANGUAGE), __("Plagium", self::LANGUAGE), 'manage_options', "plagium-admin", array(&$this,'admin_options') );
    }

    public function add_meta_boxes() {
	    add_meta_box('plagium_id', __('Plagium', self::LANGUAGE), array(&$this,'plagium_iframe'), 'post', 'advanced', 'high');
	    add_meta_box('plagium_id', __('Plagium', self::LANGUAGE), array(&$this,'plagium_iframe'), 'page', 'advanced', 'high');
    }
	
    public function add_dashboard_meta_boxes() {
	    wp_add_dashboard_widget('plagium', 'News from Plagium', array(&$this,'plagium_news'));	
    }

    public function plagium_news() {
	    $feedurl = 'http://blog.plagium.com/feeds/posts/default?alt=rss';
	    $select = 3;

	    $rss = fetch_feed($feedurl);
	    if (!is_wp_error($rss)) { // Checks that the object is created correctly
		    $maxitems = $rss->get_item_quantity($select);
		    $rss_items = $rss->get_items(0, $maxitems);
	    }
	    if (!empty($maxitems)) {
    ?>
	    <div class="rss-widget">
		    <ul>
    <?php
        foreach ($rss_items as $item) {
    ?>
		    <li><a class="rsswidget" href='<?php echo $item->get_permalink(); ?>'><?php echo $item->get_title(); ?></a> <span class="rss-date"><?php echo date_i18n(get_option('date_format') ,strtotime($item->get_date('j F Y'))); ?></span></li>
    <?php } ?>
	    </ul>
	    </div>
    <?php
	    }
    }

    public function plagium_iframe(){
        $post_id = intval( $_REQUEST['post'] );
        if ( ! $post_id ) $post_id=0;
  
	    $plagium_api_key = $this->get_admin_option('plagium_api_key');
	    $plagium_deep_search = $this->get_admin_option('plagium_deep_search');
	    $plagium_exclude_domains = $this->get_admin_option('plagium_exclude_domains');
    
	    echo '
        <input type="hidden" id="plagium_version" name="plagium_version" value="'.__(self::PLUGIN_VERSION).'" />
        <input type="hidden" id="plagium_api_key" name="plagium_api_key" value="'.__($plagium_api_key).'" />
        <input type="hidden" id="plagium_exclude_domains" name="plagium_exclude_domains" value="'.__($plagium_exclude_domains).'" />
    
	    <div style="height:30px;line-height:24px;">
            Check for plagiarism:
	        <a id="plagium_quick_search" class="button-primary" href="#nogo">'.__('Quick Search', self::LANGUAGE ).'</a> ';
        
        if ($plagium_deep_search == 'yes') echo ' <a id="plagium_deep_search" class="button-primary" href="#nogo">'.__('Deep Search', self::LANGUAGE ).'</a> ';
    
        echo '&nbsp;&nbsp;&nbsp;Search:
            <input type="radio" name="plagium_source" value="web" checked="checked" /> web
            <input type="radio" name="plagium_source" value="news" /> news
	    </div>
        <div>
        <em>The text will be analyzed paragraph by paragraph and compared with similar documents found on the internet.</em>
        </div>
	    <div id="plagium_container">
                <p id="plagium_message" class="plagium_message"></p>
                <p id="plagium_error" class="plagium_error"></p>
                <div id="plagium_content"></div>
        </div>';
    }

    public function admin_options(){
	    $uid = get_current_user_id();
		
	    if($_POST['plagium_ispost'] == 'true') {
	          //Form data sent
	          check_admin_referer('plagium-settings');
		
	          $plagium_api_key = sanitize_text_field($_POST['plagium_api_key']);
	          $this->update_admin_option('plagium_api_key', $plagium_api_key);
	          $plagium_email = sanitize_text_field($_POST['plagium_email']);
	          $this->update_admin_option('plagium_email', $plagium_email);
	          $plagium_password = sanitize_text_field($_POST['plagium_password']);
	          $this->update_admin_option('plagium_password', $plagium_password);
	          $plagium_deep_search = sanitize_text_field($_POST['plagium_deep_search']);
	          $this->update_admin_option('plagium_deep_search', $plagium_deep_search);
	          $plagium_exclude_domains = sanitize_text_field($_POST['plagium_exclude_domains']);
	          $this->update_admin_option('plagium_exclude_domains', $plagium_exclude_domains);
					
	          echo '<div class="updated settings-error"><p><strong>';
	          _e('Plagium Settings Updated');
	          echo '</strong></p></div>';
	    } else {		
	          $plagium_api_key = $this->get_admin_option('plagium_api_key');
	          $plagium_email = $this->get_admin_option('plagium_email');
	          $plagium_password = $this->get_admin_option('plagium_password');
	          $plagium_deep_search = $this->get_admin_option('plagium_deep_search');
	          $plagium_exclude_domains = $this->get_admin_option('plagium_exclude_domains');
	    }
	    ?>
		
	    <div class="wrap">
          <div id="icon-themes" class="icon32" ><br></div>
	      <h2><?php _e( 'Plagium', LANGUAGE ); ?></h2>
	      <div id="poststuff" style="padding-top:10px; position:relative;">
	      <div style="float:left; width:74%; padding-right:1%;">

    <?php 
    $info = '
	      <div>
		        <p>'.__("Plagium is an innovative, fast, and easy-to-use means to check text against possible plagiarism or possible sources of origination.").'
		        </p>
		        <p>
		          '.__("Plagium is a service of Septet Systems Inc., a New York-based company that specializes in advanced search solutions for industry, the public sector, and government. We have aimed to provide an easy to use service that applies to a broad base of users.").'
		        </p>
		        <p>
		          '.__("Plagium makes use of a proprietary technique that intelligently breaks up the input text into smaller \"snippets\". These snippets are matched against Web content in an efficient manner, with the matches scored to determine what documents match the input text. The result is a much cleaner view of possible matching documents, a view that is much less noisy than the results offered by the major search engines.").'
		        </p>
                <p>
                    Plugin Version: '.__(self::PLUGIN_VERSION).'
                </p>
                <p id="plagium_message" class="plagium_message"></p>
		      </div>
    ';
			    echo $this->format_info(__('About Plagium') , '',$info,'');
    ?>
		
		      <form name="plagium_settings_form" id="plagium_settings_form" method="post" action="<?php echo str_replace( '%7E', '~', $_SERVER['REQUEST_URI']); ?>">
		        <?php wp_nonce_field('plagium-settings'); ?>
		
		        <input type="hidden" name="plagium_ispost" value="true">
			    <?php 
            
                if ($plagium_deep_search != 'yes') $not_authorized='selected="selected"';
                else $not_authorized='';
            
			    $account = array(
				    __('Email') => '<input type="hidden" id="plagium_version" name="plagium_version" value="'.__(self::PLUGIN_VERSION).'" /><input type="hidden" id="plagium_api_key" name="plagium_api_key" value="'.$plagium_api_key.'" /><input type="text" id="plagium_email" name="plagium_email" value="'.$plagium_email.'" size="40" maxlength="50" /> 
					    <span class="description">'.__(" Your email registered with your plagium.com account").'</span>',
				    __('Password') => '<input type="password" id="plagium_password" name="plagium_password" value="'.$plagium_password.'" size="40" maxlength="20" /> 
					    <span class="description">'.__(" Your plagium.com account' password").'</span>',
			    );
            
			    $options = array(
				    __('Deep Search') => __('<select name="plagium_deep_search"><option value="yes">Authorized</option><option value="no" '.$not_authorized.'>Not Authorized</option></select>')
				    /*__('Excluded Urls or Domain') => __("Exclude these domains from searches: (example ").parse_url(home_url(), PHP_URL_HOST).' ), '.__('one domain per line').'<br />
			            <textarea name="plagium_exclude_domains" rows="5" cols="90">'.$plagium_exclude_domains.'</textarea>',*/
			    );
			
                $accounttop = __('<p id="plagium_account_settings_error" class="plagium_error"></p>');
                $accountbottom = __('<p>If you do not have a Plagium account, please <a href="https://www.plagium.com/account.cfm" target="_blank">Sign-Up</a>.</p>');
            
			    echo $this->format_info(__('Account'), $accounttop,$account,$accountbottom);
			    echo $this->format_info(__('Options'), '',$options,'');
			    ?>
		        <p class="submit"><input type="button" class="button-primary" id="plagium_settings_submit" name="Submit" value="<?php _e('Save Changes', LANGUAGE ) ?>" /></p>
		      </form>
	      </div>
		  
	      <div style="float:right; width:25%;">
    <?php
    ob_start();
    $this->plagium_news();
    $plagium_news = ob_get_clean();

    echo $this->format_info('A Plugin by Plagium', '','
		    <a target="_blank" href="http://www.plagium.com" title="Plagium">
			    <img border="0" src="'.plugin_dir_url(__FILE__).'assets/plagium.png" title="Plagium" alt="Plagium" style="display:block; margin:10px auto;">
		    </a>
	    ','')
	    .$this->format_info('News', '',$plagium_news,'')
	    .'
		    </div>
	    </div>
	    </div>';
    }  


    function format_info($title, $top, $content, $bottom) {
	    if (is_array($content)) {
		    $content_string = '<table>';
		    foreach ($content as $name=>$value) {
			    $content_string .= '<tr>
				    <td style="width:130px; vertical-align: text-top;">'.__($name, 'menu-test' ).':</td>	
				    <td>'.$value.'</td>
				    </tr>';
		    }
		    $content_string .= '</table>';
	    } else {
		    $content_string = $content;
	    }

	    $out = '
		    <div class="postbox">
			    <h3>'.__($title, 'menu-test' ).'</h3>
			    <div class="inside">'.$top.''.$content_string.''.$bottom.'</div>
		    </div>
		    ';
	    return $out;
    }
	
    function get_options_default () {
	    $option = array();

	    return $option;
    }
} // END 

